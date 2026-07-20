UPDATE "leaves" SET "leaveType" = 'PAID' WHERE "leaveType"::text IN ('SICK', 'ANNUAL', 'EMERGENCY', 'OTHER');
