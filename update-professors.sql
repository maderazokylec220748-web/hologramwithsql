-- Update professors table with correct Westmead faculty data
DELETE FROM professors;

INSERT INTO professors (id, fullName, position, department, email, phone, description) VALUES 
('prof-1', 'Dr. Arlene D. Castor', 'President & CEO', 'Mathematics', 'arlene.castor@westmead.edu.ph', '+63-43-740-1000', 'President and CEO of Westmead International School'),
('prof-2', 'Dr. Marites D. Manlongat', 'Vice President for Academic Affairs', 'SEBA/CAS', 'marites.manlongat@westmead.edu.ph', '+63-43-740-1001', 'Vice President for Academic Affairs'),
('prof-3', 'Iluminada De Chavez', 'Chairman of the Board', 'Board of Trustees', 'iluminada.dechavez@westmead.edu.ph', '+63-43-740-1002', 'Chairman of the Board'),
('prof-4', 'Mr. John Andrew C. Manalo', 'Professor', 'CITCS', 'john.manalo@westmead.edu.ph', '+63-43-740-1003', 'Professor in the College of Information Technology and Computer Science'),
('prof-5', 'Mr. Roberto Fernandez', 'Instructor', 'Arts & Design', 'roberto.fernandez@westmead.edu.ph', '+63-43-740-1004', 'Instructor specializing in Arts and Design programs'),
('prof-6', 'Prof. Ernesto Carlo L. De Chavez', 'Dean', 'CTHM', 'ernesto.dechavez@westmead.edu.ph', '+63-43-740-1005', 'Dean of the College of Tourism and Hospitality Management'),
('prof-7', 'Prof. Rosana De Chavez', 'CITCS Dean', 'CITCS', 'rosana.dechavez@westmead.edu.ph', '+63-43-740-1006', 'Dean of the College of Information Technology and Computer Science');
