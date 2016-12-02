USE paladin2;

IF OBJECT_ID('tempdb..##Temp') IS NOT NULL
	DROP TABLE ##Temp

SELECT tsk.TaskID
	,tsk.TaskStatus
	,CASE 
		WHEN DATEDIFF(day, GETDATE(), DATEADD(day, tsk.FrequencyDays, tsk.LastCompleted)) <= 14 THEN 0
		ELSE 1
	END AS [OnTime]
INTO ##Temp
FROM Task tsk INNER JOIN Tool t ON t.ToolID = tsk.ToolID 
WHERE t.RfidAddress = $(rfidAddress)
AND (tsk.TaskStatus = 'OnTime' 
AND DATEDIFF(day, GETDATE(), DATEADD(day, tsk.FrequencyDays, tsk.LastCompleted)) <= 14) 
OR tsk.TaskStatus = 'PastDue';

DECLARE @taskId INT
DECLARE @logId INT

WHILE EXISTS (SELECT * FROM ##Temp)
BEGIN
	SELECT TOP 1 @taskId = TaskID FROM ##Temp

	INSERT INTO [dbo].[TaskLog] ([OnTime], [DateCreated])
	VALUES (CASE WHEN (SELECT TaskStatus FROM ##Temp WHERE TaskID = @taskId) = 'PastDue' THEN 0 ELSE 1 END, GETDATE());

	SELECT @logId = SCOPE_IDENTITY();

	UPDATE [dbo].Task
	SET LastLog = @logId, TaskStatus = 'ConfirmPending'
	WHERE TaskID = @taskId;

	DELETE ##Temp WHERE TaskID = @taskId;
END

DROP TABLE ##Temp;