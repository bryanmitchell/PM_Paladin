USE paladin2;

UPDATE Task
SET TaskStatus = 'PastDue'
WHERE DATEDIFF(day, GETDATE(), DATEADD(day,[FrequencyDays],[LastCompleted])) <= 0
AND TaskStatus = 'OnTime';