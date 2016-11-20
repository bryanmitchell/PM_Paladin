USE [paladin2];
GO
UPDATE [dbo].[Task] 
SET [TaskStatus] = 'PastDue' 
WHERE DATEDIFF(day, GETDATE(), DATEADD(day,[FrequencyDays],[LastCompleted])) < 0
AND [TaskStatus] = 'OnTime';
GO