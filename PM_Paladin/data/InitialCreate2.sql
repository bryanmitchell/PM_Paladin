/*
PM paladin2 Initial Table Creation
October 14, 2016
By: Luis Murphy

Entities: ProductionLine, Workstation, Tool, Task, Log, Employee
Relations: LogBelongsTo, WorkstationAssignedTo, ToolAssignedTo, EmployeeType, PreviousLogToNextLog
*/

-- Remember server.database.schema.object (table, function, etc)
-- LRMM-LENOVO-Y40\Luis.paladin.dbo.ProductionLine
-- PK: Primary Key, AK: Alternate Key, FK: Foreign Key, IX: IndeX, CK: ChecK, DF: DeFault


CREATE DATABASE paladin2
GO
USE paladin2
--------------
-- Entities --
--------------
CREATE TABLE paladin2.dbo.ProductionLine (
    LineID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LineName nvarchar(MAX) NOT NULL,
	SupervisorFirstName nvarchar(25) NOT NULL,
	SupervisorLastName nvarchar(50) NOT NULL,
	SupervisorEmail varchar(320) NOT NULL,
	RemoteIoAddress INT NOT NULL
);	

CREATE TABLE paladin2.dbo.Workstation (
    WorkstationID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LineID INT NOT NULL,
    WorkstationName nvarchar(MAX) NOT NULL,
	GreenLightOn bit NOT NULL,
	YellowLightOn bit NOT NULL,
	RedLightOn bit NOT NULL,
	GreenLightModuleNumber INT NOT NULL,
	GreenLightPointNumber INT NOT NULL,
	YellowLightModuleNumber INT NOT NULL,
	YellowLightPointNumber INT NOT NULL,
	RedLightModuleNumber INT NOT NULL,
	RedLightPointNumber INT NOT NULL,
	CONSTRAINT FK_Workstation_LineID
		FOREIGN KEY (LineID) 
		REFERENCES ProductionLine(LineID)
		ON DELETE NO ACTION
		ON UPDATE CASCADE
);

CREATE TABLE paladin2.dbo.Tool (
    ToolID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    WorkstationID INT FOREIGN KEY REFERENCES Workstation(WorkstationID),
    ToolName nvarchar(MAX) NOT NULL,
	ToolType nvarchar(10) NOT NULL,
	RemoteIoModuleNumber INT NOT NULL,
	RemoteIoPointNumber INT NOT NULL,
	IsActive bit NOT NULL,
	RfidAddress INT NOT NULL,
	Supplier nvarchar(MAX) NOT NULL,
	YearBought date NOT NULL,
	OriginalCostDollars smallmoney NOT NULL,
	CONSTRAINT CK_Tool_ToolType 
		CHECK (ToolType = 'Pneumatic' OR ToolType = 'Electric'),
	CONSTRAINT FK_Tool_WorkstationID
		FOREIGN KEY (WorkstationID) 
		REFERENCES Workstation(WorkstationID)
		ON DELETE NO ACTION
		ON UPDATE CASCADE
);

-- LastCompleted should be updated whenever TaskStatus changes to OnTime
CREATE TABLE paladin2.dbo.Task (
    TaskID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ToolID INT NOT NULL,
    EstHours float NOT NULL,
	FrequencyDays smallint NOT NULL,
	TaskDescription text NOT NULL,
	TaskPriority nvarchar(5) NOT NULL,
	CreatedOn datetime NOT NULL DEFAULT GETDATE(),
	LastCompleted datetime NOT NULL,
	TaskStatus nvarchar(50) NOT NULL,
	DaysLeft14 bit NOT NULL,
	DaysLeft3 bit NOT NULL,
	LastLog INT NULL,
	CONSTRAINT CK_Task_TaskStatus 
		CHECK (TaskStatus = 'OnTime' OR TaskStatus = 'PastDue' OR TaskStatus = 'ConfirmPending' OR TaskStatus = 'ConfirmPartial' OR TaskStatus = 'ApprovePending'),
	CONSTRAINT CK_Task_TaskPriority 
		CHECK (TaskPriority = 'Lo' OR TaskPriority = 'Med' OR TaskPriority = 'Hi'),
	CONSTRAINT FK_Task_ToolID
		FOREIGN KEY (ToolID) 
		REFERENCES Tool(ToolID)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

-- Log on either OnTime -> ConfirmPending or PastDue -> ConfirmPending, record which one, 
-- add a Finished column that changes to 1 on ApprovePending -> OnTime, how to track which task should be finished?
CREATE TABLE paladin2.dbo.TaskLog (
    LogID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OnTime BIT NOT NULL, -- 0 for 'PastDue', 1 for 'OnTime'
    DateCreated DATETIME NOT NULL DEFAULT GETDATE(), -- DEFAULT SHOULD BE 
    DateFinished DATETIME NULL, -- if NULL, not finished yet
);

-- dba.stackexchange.com/questions/149945/check-constraint-to-enforce-pattern-match
CREATE TABLE paladin2.dbo.Employee (
    Sso VARCHAR(9) NOT NULL PRIMARY KEY,
    FirstName nvarchar(MAX) NOT NULL,
	LastName nvarchar(MAX) NOT NULL,
	Email varchar(320) NOT NULL,
	PasswordHash VARCHAR(60) NOT NULL,
	CONSTRAINT CK_Employee_Sso 
		CHECK (Sso LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

CREATE TABLE paladin2.dbo.EmployeeRole (
    Sso INT NOT NULL,
    EmpRole nvarchar(20) NOT NULL,
	CONSTRAINT PK_EmployeeRole 
		PRIMARY KEY (Sso, EmpRole),
	CONSTRAINT CK_EmployeeRole_EmpRole 
		CHECK (EmpRole = 'Administrator' OR EmpRole = 'Engineer' OR EmpRole = 'Technician'),
	CONSTRAINT FK_EmployeeRole_Sso
		FOREIGN KEY (Sso) 
		REFERENCES Employee(Sso)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

GO


-------------------
-- Relationships --
-------------------
-- Input sso and type (admin, eng, tech), output "boolean" (1 or 0)
CREATE FUNCTION dbo.CheckEmployeeRole(@empSso INT, @empRole NVARCHAR(MAX))
RETURNS INT
BEGIN
	RETURN (
		SELECT COUNT(*)
		FROM EmployeeRole er
		WHERE er.Sso = @empSso AND er.EmpRole = @empRole
	);
END
GO

USE paladin2
-- Workstation assigned to engineers
-- Do not allow orphan ws
CREATE TABLE paladin2.dbo.WorkstationAssignedTo (
	WorkstationID int NOT NULL,
    Sso int NOT NULL,
	CONSTRAINT PK_WorkstationAssignedTo 
		PRIMARY KEY (WorkstationID, Sso),
	CONSTRAINT FK_WorkstationAssignedTo_WorkstationID 
		FOREIGN KEY (WorkstationID) 
		REFERENCES Workstation(WorkstationID)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT FK_WorkstationAssignedTo_Sso 
		FOREIGN KEY (Sso) 
		REFERENCES Employee(Sso)
		ON DELETE NO ACTION
		ON UPDATE CASCADE,
	CONSTRAINT CK_WorkstationAssignedTo_Sso 
		CHECK (dbo.CheckEmployeeRole(Sso,'Engineer') > 0),
);

-- Tools assigned to technicians
-- Do not allow orphan tools
CREATE TABLE paladin2.dbo.ToolAssignedTo (
	ToolID int NOT NULL,
    Sso int NOT NULL,
	CONSTRAINT PK_ToolAssignedTo 
		PRIMARY KEY (ToolID, Sso),
	CONSTRAINT FK_ToolAssignedTo_ToolID 
		FOREIGN KEY (ToolID) 
		REFERENCES Tool (ToolID)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT FK_ToolAssignedTo_Sso 
		FOREIGN KEY(Sso) 
		REFERENCES Employee(Sso)
		ON DELETE NO ACTION
		ON UPDATE CASCADE,
	CONSTRAINT CK_ToolAssignedTo_Sso 
		CHECK (dbo.CheckEmployeeRole(Sso,'Technician') > 0),
);
GO
--