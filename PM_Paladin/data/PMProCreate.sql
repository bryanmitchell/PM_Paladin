USE paladin2

CREATE TABLE paladin2.dbo.EmployeeSupervisor (
	Sso int NOT NULL PRIMARY KEY,
	FirstName nvarchar(MAX) NOT NULL,
	LastName nvarchar(MAX) NOT NULL,
	Email varchar(320) NOT NULL,
	CONSTRAINT FK_EmployeeSupervisor_Sso
		FOREIGN KEY (Sso) 
		REFERENCES Employee(Sso)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE paladin2.dbo.tblPM_MasterEquipment (
	[intEquipRecID] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[strFacilityName] NVARCHAR(MAX),
	[strEquipID] NVARCHAR(MAX), -- workstation
	[strEquipDescription] NVARCHAR(MAX),
	[strProcess_] NVARCHAR(MAX),
	[strEquipType_] NVARCHAR(MAX),
	[strEquipLocation] NVARCHAR(MAX),
	[strProduct_line_t] NVARCHAR(MAX),--ProductionLine
	[strEquipSerialNo] NVARCHAR(MAX),
	[strEquipModelNo] NVARCHAR(MAX),
	[strEQ_MfgsName] NVARCHAR(MAX),
	[strstatus_active] NVARCHAR(MAX),
	[strEHS_Critical] NVARCHAR(MAX),
	[strEquipLoc_Sector_t] NVARCHAR(MAX),
	[strAvailable_tcalc] NVARCHAR(MAX),
	[strEquip_Supplier] NVARCHAR(MAX),
	[datYearMaker] DATETIME,
	[strRedX_Equipment] NVARCHAR(MAX),
	[fltOriginalCost_USDollar] FLOAT,
	[fltOriginalCostDollar_other] FLOAT,
	[strEquipTagNo_GE] NVARCHAR(MAX),
	[strEquipTagNo_Other] NVARCHAR(MAX),
	[strAppropriationNo] NVARCHAR(MAX),
	[fltNBV_Current] FLOAT,
	[fltNBV_Previous] FLOAT,
	[fltNBV_Date] FLOAT,
	[fltNBV_PreviousDate] FLOAT,
	[strCurrency] NVARCHAR(MAX),
	[strSub_Area] NVARCHAR(MAX),
	[strSAP_ID] NVARCHAR(MAX),
	[strComments] NVARCHAR(MAX),
	[datCreatedDate] DATETIME,
	[fltCTQ_Flowdown_CM_Dollars] FLOAT,
	[fltCTQ_Flowdown_9blck_Cost_Pos_Result] FLOAT,
	[fltCTQ_Flowdown_9blck_Qual_result] FLOAT,
);

CREATE TABLE paladin2.dbo.tblPM_EqStatus (
	[intPM_Item_Rec_Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[intEquipRecID] INT,
	[datPM_DueDate] DATETIME,
	[strPMs_Scheduled] NVARCHAR(MAX),
	[fltEstHrs_PM] FLOAT,
	[fltSpares_DollarAmt] FLOAT,
	[strWO_NonPM_NoOpen] NVARCHAR(MAX),
	[strWO_Priority] NVARCHAR(MAX),
	[strWO_PMType] NVARCHAR(MAX),
	[strWO_AssignedToName] NVARCHAR(MAX),
	[datWO_DueDate] DATETIME,
	[strWO_Description_View] NVARCHAR(MAX),
	[datPM_LastComplete] DATETIME,
);

CREATE TABLE paladin2.dbo.tblPM_ScheduledPmItems (
	[intPmTaskRecId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[intEquipRecID] INT,
	[EquipRecID] INT,
	[Status] NVARCHAR(MAX),
	[Item#] INT,
	[Description] NVARCHAR(MAX),
	[Due] DATETIME,
	[Frequency Days] INT,
	[Assigned To] NVARCHAR(MAX),
	[Est Hrs] FLOAT,
	[Last Complet] DATETIME,
	[Created] DATETIME,
);

CREATE TABLE paladin2.dbo.Flags (
	[id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[name] NVARCHAR(MAX) NOT NULL,
	[value] BIT NOT NULL DEFAULT 0
);

INSERT INTO [paladin2].[dbo].[Flags] ([name], [value])
VALUES ('ChangeOccurred',0);

CREATE TABLE paladin2.dbo.RfidReader (
	[Line] INT NOT NULL,
	[Reader] INT NOT NULL,
	[LastTagRead] INT,
	CONSTRAINT PK_RfidReader 
		PRIMARY KEY (Line, Reader)
);
INSERT INTO [paladin2].[dbo].[RfidReader] ([Line], [Reader])
VALUES (1,0), (1,1), (1,2), (1,3), (1,4), (1,5), (1,6), (1,7);

GO
--