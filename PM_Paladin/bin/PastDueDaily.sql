USE paladin2;

UPDATE Task
SET TaskStatus = 'PastDue'
WHERE DATEDIFF(day, GETDATE(), DATEADD(day,[FrequencyDays],[LastCompleted])) <= 0
AND TaskStatus = 'OnTime';

-- Turn ON Active bits for tools
UPDATE Tool
SET IsActive = 1;


-- Turn OFF Active bits for tools
WITH OffTools AS (
	SELECT DISTINCT tsk.ToolID
	FROM Task tsk
	WHERE TaskStatus = 'PastDue'
	OR TaskStatus = 'ConfirmPending'
	OR TaskStatus = 'ApprovePending'
)
UPDATE Tool
SET [IsActive] = 0
FROM OffTools
WHERE Tool.ToolID IN (SELECT ToolID FROM OffTools);


-- Turn OFF ALL lights
UPDATE Workstation
SET GreenLightOn = 0, YellowLightOn = 0, RedLightOn = 0;


-- Turn ON green lights
WITH Eq AS (
	SELECT ws.WorkstationID, t.ToolID, tsk.TaskID, tsk.TaskStatus, 
		DATEDIFF(day, GETDATE(), DATEADD(day, tsk.FrequencyDays, tsk.LastCompleted)) AS [DaysLeft]
	FROM Task tsk 
	INNER JOIN Tool t ON t.ToolID = tsk.ToolID
	INNER JOIN Workstation ws ON ws.WorkstationID = t.WorkstationID
)
UPDATE Workstation
SET GreenLightOn = 1
FROM Eq
WHERE Workstation.WorkstationID NOT IN (
	SELECT DISTINCT Eq.WorkstationID
	FROM Eq
	WHERE Eq.TaskStatus = 'PastDue'
	OR Eq.TaskStatus = 'ConfirmPending'
	OR Eq.TaskStatus = 'ConfirmPartial'
	OR Eq.TaskStatus = 'ApprovePending'
);


-- Turn ON yellow lights
WITH Eq AS (
	SELECT ws.WorkstationID, t.ToolID, tsk.TaskID, tsk.TaskStatus, 
		DATEDIFF(day, GETDATE(), DATEADD(day, tsk.FrequencyDays, tsk.LastCompleted)) AS [DaysLeft]
	FROM Task tsk 
	INNER JOIN Tool t ON t.ToolID = tsk.ToolID
	INNER JOIN Workstation ws ON ws.WorkstationID = t.WorkstationID
)
UPDATE Workstation
SET YellowLightOn = 1
FROM Eq
WHERE Workstation.WorkstationID IN (
	SELECT DISTINCT Eq.WorkstationID
	FROM Eq
	WHERE (Eq.DaysLeft <= 14
		AND Eq.TaskStatus = 'OnTime')
	OR Eq.TaskStatus = 'ConfirmPartial'
);


-- Turn ON red lights
WITH Eq AS (
	SELECT ws.WorkstationID, t.ToolID, tsk.TaskID, tsk.TaskStatus, 
		DATEDIFF(day, GETDATE(), DATEADD(day, tsk.FrequencyDays, tsk.LastCompleted)) AS [DaysLeft]
	FROM Task tsk 
	INNER JOIN Tool t ON t.ToolID = tsk.ToolID
	INNER JOIN Workstation ws ON ws.WorkstationID = t.WorkstationID
)
UPDATE Workstation
SET RedLightOn = 1
FROM Eq
WHERE Workstation.WorkstationID IN (
	SELECT DISTINCT Eq.WorkstationID
	FROM Eq
	WHERE Eq.TaskStatus = 'PastDue'
	OR Eq.TaskStatus = 'ConfirmPending'
	OR Eq.TaskStatus = 'ApprovePending'
);

-- Update ChangeOccurred flag
UPDATE Flags
SET [value] = 1
WHERE [name] = 'ChangeOccurred';