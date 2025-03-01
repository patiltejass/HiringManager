const express = require("express");
const nodemailer = require('nodemailer');

const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidates");
const authenticateToken = require("./middleware/auth");
const db = require("./db");
const cors = require("cors");
const app = express();
const port = 3001;
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRoutes);
app.use("/candidates", candidateRoutes);

const util = require("util");

// const util = require('util');

app.get("/users", async (req, res) => {
  try {
    const sql = 'SELECT userId, username, role FROM users WHERE role = "user"';

    let params = [];

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Error: " + err.message);
        return res.status(500).json({ message: "Error fetching candidates" });
      }

      res.json(results);
    });
  } catch (err) {
    // Log the full error object for debugging
    console.error(
      "Error fetching users:",
      util.inspect(err, { showHidden: false, depth: null })
    );
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

app.get("/form", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "form.html"));
});

app.get("/updatePositions", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "updatePositions.html"));
});

// app.post('/submit', authenticateToken, upload.single('applicantResume'), (req, res) => {
//     const {
//         applicantName,
//         applicantPhone,
//         applicantEmail,
//         currentCompany,
//         candidateWorkLocation,
//         nativeLocation,
//         qualification,
//         experience,
//         skills,
//         noticePeriod,
//         band,
//         dateApplied,
//         positionTitle,
//         positionId,
//         status,
//         stage,
//         dateOfPhoneScreen,
//         interviewDate,
//         dateOfOffer,
//         reasonNotExtending,
//         notes
//     } = req.body;

//     const profileOwner = req.user.username;
//     const applicantResume = req.file.buffer;

//     const sql = `
//         INSERT INTO ApplicantTracking (
//             profileOwner,
//             applicantName,
//             applicantPhone,
//             applicantEmail,
//             currentCompany,
//             candidateWorkLocation,
//             nativeLocation,
//             qualification,
//             experience,
//             skills,
//             noticePeriod,
//             band,
//             applicantResume,
//             dateApplied,
//             positionTitle,
//             positionId,
//             status,
//             stage,
//             dateOfPhoneScreen,
//             interviewDate,
//             dateOfOffer,
//             reasonNotExtending,
//             notes
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(sql, [
//         profileOwner,
//         applicantName,
//         applicantPhone,
//         applicantEmail,
//         currentCompany,
//         candidateWorkLocation,
//         nativeLocation,
//         qualification,
//         experience,
//         skills,
//         noticePeriod,
//         band,
//         applicantResume,
//         dateApplied,
//         positionTitle,
//         positionId,
//         status,
//         stage || null,
//         dateOfPhoneScreen || null,
//         interviewDate || null,
//         dateOfOffer || null,
//         reasonNotExtending || null,
//         notes || null
//     ], (err, result) => {
//         if (err) {
//             console.error('Error: ' + err.message);
//             return res.status(500).json({ message: 'Error submitting form' });
//         }

//         res.status(200).json({ message: 'Form submitted successfully' });
//     });
// });

async function sendEmailToAdmin(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tp291101@gmail.com',
      pass: 'hnmq vbwm rysa fdre'
    }
  });

  const mailOptions = {
    from: 'tp291101@gmail.com',
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
async function getAdminUsers() {
  const sql = 'SELECT username FROM users WHERE role = "admin"';

  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching admin users: " + err.message);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}


app.post("/submit/public", upload.single("applicantResume"), async (req, res) => {
  try {
    const {
      applicantName,
      applicantPhone,
      applicantEmail,
      currentCompany,
      candidateWorkLocation,
      nativeLocation,
      qualification,
      experience,
      skills,
      noticePeriod,
      currentctc,
      expectedctc,
      band = "L0",
      positionTitle,
      positionId,
      status,
      stage,
      dateOfPhoneScreen,
      interviewDate,
      dateOfOffer,
      reasonNotExtending,
      notes,
    } = req.body;

    const profileOwner = "admin";
    const applicantResume = req.file.buffer;
    let dateApplied = new Date();

    // Check for existing records
    const checkSql = `
      SELECT COUNT(*) AS count FROM ApplicantTracking 
      WHERE applicantPhone = ? OR applicantEmail = ?
    `;

    db.query(checkSql, [applicantPhone, applicantEmail], (err, results) => {
      if (err) {
        console.error("Error: " + err.message);
        return res.status(500).json({ message: "Error checking for duplicates" });
      }

      if (results[0].count > 0) {
        return res.status(400).json({ message: "Duplicates not allowed" });
      }

      // If no duplicates found, insert new record
      const insertSql = `
        INSERT INTO ApplicantTracking (
          profileOwner,
          applicantName,
          applicantPhone,
          applicantEmail,
          currentCompany,
          candidateWorkLocation,
          nativeLocation,
          qualification,
          experience,
          skills,
          noticePeriod,
          currentctc,
          expectedctc,
          band,
          applicantResume,
          dateApplied,
          positionTitle,
          positionId,
          status,
          stage,
          dateOfPhoneScreen,
          interviewDate,
          dateOfOffer,
          reasonNotExtending,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          profileOwner,
          applicantName,
          applicantPhone,
          applicantEmail,
          currentCompany,
          candidateWorkLocation,
          nativeLocation,
          qualification,
          experience,
          skills,
          noticePeriod,
          currentctc,
          expectedctc,
          band,
          applicantResume,
          dateApplied,
          positionTitle,
          positionId,
          status,
          stage || null,
          dateOfPhoneScreen || null,
          interviewDate || null,
          dateOfOffer || null,
          reasonNotExtending || null,
          notes || null,
        ],
        async (err, result) => {
          if (err) {
            console.error("Error: " + err.message);
            return res.status(500).json({ message: "Error submitting form" });
          }

          try {
            const adminEmails = await getAdminUsers();

            console.log(JSON.stringify(adminEmails));

            adminEmails.forEach(admin => {
               sendEmailToAdmin(
                admin.username,
                "New Applicant Submission",
                `
                  A new applicant has submitted the form:
                  Applicant Name: ${applicantName}
                  Applicant Email: ${applicantEmail}
                  Applicant Phone: ${applicantPhone}
                  Position Applied: ${positionTitle}
                `
              );
            });

            res.status(200).json({ message: "Form submitted successfully" });
          } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ message: "Error submitting form" });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error: " + error.message);
    res.status(500).json({ message: "Error submitting form" });
  }
});



// Add this function to send the email to the admin
// async function sendEmailToAdmin(to, subject, text) {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'tp291101@gmail.com',
//       pass: 'uxun hadx tosg phof'
//     }
//   });

//   const mailOptions = {
//     from: 'tp291101@gmail.com',
//     to:'mabipi9043@brinkc.com',
//     subject:'vahv',
//     text:'fi;uqovqwwvwefhqpcq[pvphvolblkwn;n'
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw error;
//   }
// }

app.get(
  "/positionWithActiveApplicants",
  authenticateToken,
  async (req, res) => {
    try {
      const query = `
        SELECT 
          op.positionId, 
          op.positionTitle, 
          op.jobdescription, 
          op.manager,
          op.openPositions,
          op.experienceRequired,
          GROUP_CONCAT(CASE WHEN at.status = 'OPEN' THEN at.applicantName END) as activeApplicants
        FROM 
          OpenPositions op
        LEFT JOIN 
          ApplicantTracking at ON op.positionId = at.positionId
        GROUP BY 
          op.positionId, op.positionTitle, op.jobdescription
      `;

      let results;

      await db.query(query, (err, result) => {
        if (err) {
          console.error("Error fetching positions: " + err.message);
          return res.status(500).json({ message: "Error fetching positions" });
        }

        results = result;

        const processedResults = results.map((row) => ({
          ...row,
          activeApplicants: row.activeApplicants
            ? row.activeApplicants.split(",")
            : [],
        }));

        res.json(processedResults);
      });

      // Process the results to split the concatenated names
    } catch (error) {
      console.error("Error fetching positions with active applicants:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/submit",
  authenticateToken,
  upload.single("applicantResume"),
  (req, res) => {
    const {
      applicantName,
      applicantPhone,
      applicantEmail,
      currentCompany,
      candidateWorkLocation,
      nativeLocation,
      qualification,
      experience,
      skills,
      noticePeriod,
      currentctc,
      expectedctc,
      band,
      // dateApplied,
      positionTitle,
      positionId,
      status,
      stage,
      dateOfPhoneScreen,
      interviewDate,
      dateOfOffer,
      reasonNotExtending,
      notes,
    } = req.body;
    const profileOwner = req.user.username;

    const applicantResume = req.file.buffer;
    let dateApplied = new Date();

    // Check for existing records
    const checkSql = `
        SELECT COUNT(*) AS count FROM ApplicantTracking 
        WHERE applicantPhone = ? OR applicantEmail = ?
    `;

    db.query(checkSql, [applicantPhone, applicantEmail], (err, results) => {
      if (err) {
        console.error("Error: " + err.message);
        return res
          .status(500)
          .json({ message: "Error checking for duplicates" });
      }

      if (results[0].count > 0) {
        return res
          .status(400)
          .json({ message: "User with this Email Or Phone already exists!" });
      }

      // If no duplicates found, insert new record
      const insertSql = `
    INSERT INTO ApplicantTracking (
        profileOwner,
        applicantName,
        applicantPhone,
        applicantEmail,
        currentCompany,
        candidateWorkLocation,
        nativeLocation,
        qualification,
        experience,
        skills,
        noticePeriod,
        currentctc,
        expectedctc,
        band,
        applicantResume,
        dateApplied,
        positionTitle,
        positionId,
        status,
        stage,
        dateOfPhoneScreen,
        interviewDate,
        dateOfOffer,
        reasonNotExtending,
        notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

      db.query(
        insertSql,
        [
          profileOwner,
          applicantName,
          applicantPhone,
          applicantEmail,
          currentCompany,
          candidateWorkLocation,
          nativeLocation,
          qualification,
          experience,
          skills,
          noticePeriod,
          currentctc,
          expectedctc,
          band,
          applicantResume,
          dateApplied,
          positionTitle,
          positionId,
          status,
          stage || null,
          dateOfPhoneScreen || null,
          interviewDate || null,
          dateOfOffer || null,
          reasonNotExtending || null,
          notes || null,
        ],
        (err, result) => {
          if (err) {
            console.error("Error: " + err.message);
            return res.status(500).json({ message: "Error submitting form" });
          }

          res.status(200).json({ message: "Form submitted successfully" });
        }
      );
    });
  }
);

// app.get(
//   "/positionWithActiveApplicants",
//   authenticateToken,
//   async (req, res) => {
//     try {
//       const query = `
//         SELECT
//           op.positionId,
//           op.positionTitle,
//           op.jobdescription,
//           op.manager,
//           GROUP_CONCAT(CASE WHEN at.status = 'OPEN' THEN at.applicantName END) as activeApplicants
//         FROM
//           OpenPositions op
//         LEFT JOIN
//           ApplicantTracking at ON op.positionId = at.positionId
//         GROUP BY
//           op.positionId, op.positionTitle, op.jobdescription
//       `;

//       let results;

//       await db.query(query, (err, result) => {
//         if (err) {
//           console.error("Error fetching positions: " + err.message);
//           return res.status(500).json({ message: "Error fetching positions" });
//         }

//         results = result;

//         const processedResults = results.map((row) => ({
//           ...row,
//           activeApplicants: row.activeApplicants
//             ? row.activeApplicants.split(",")
//             : [],
//         }));

//         res.json(processedResults);
//       });

//       // Process the results to split the concatenated names
//     } catch (error) {
//       console.error("Error fetching positions with active applicants:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );

app.get("/users/activity", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const sql =
    "SELECT username, loggedInTime, loggedOutTime FROM users WHERE role = 'user'";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users: " + err.message);
      return res.status(500).json({ message: "Error fetching users" });
    }

    res.status(200).json(results);
  });
});

app.post("/updatePosition", authenticateToken, (req, res) => {
  const {
    positionTitle,
    positionId,
    manager,
    description,
    status,
    openPositions,
    experienceRequired,
  } = req.body;

  console.log(
    positionTitle,
    positionId,
    manager,
    description,
    status,
    openPositions,
    experienceRequired
  );

  const checkSql = "SELECT * FROM OpenPositions WHERE positionId = ?";
  db.query(checkSql, [positionId], (err, results) => {
    if (err) {
      console.error("Error checking position: " + err.message);
      return res.status(500).json({ message: "Error checking position" });
    }

    if (results.length > 0) {
      // Position exists, update it
      const updateSql = `
                  UPDATE OpenPositions 
                  SET positionTitle = ?,
                      jobdescription = ?,
                      status = ?,
                      openPositions = ?,
                      experienceRequired = ?
                  WHERE positionId = ?
              `;
      db.query(
        updateSql,
        [
          positionTitle,
          description,
          status,
          openPositions,
          experienceRequired,
          positionId,
        ],
        (err, result) => {
          if (err) {
            console.error("Error updating position: " + err.message);
            return res.status(500).json({ message: "Error updating position" });
          }

          res.status(200).json({ message: "Position updated successfully" });
        }
      );
    } else {
      // Position does not exist, insert new position
      const insertSql = `
                  INSERT INTO OpenPositions (positionId, positionTitle, manager, openPositions, experienceRequired, jobdescription, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)
              `;
      db.query(
        insertSql,
        [
          positionId,
          positionTitle,
          manager,
          openPositions,
          experienceRequired,
          description,
          status,
        ],
        (err, result) => {
          if (err) {
            console.error("Error inserting position: " + err.message);
            return res
              .status(500)
              .json({ message: "Error inserting position" });
          }

          res.status(200).json({ message: "Position added successfully" });
        }
      );
    }
  });
});

// app.post(
//   "/submit",
//   authenticateToken,
//   upload.single("applicantResume"),
//   (req, res) => {
//     const {
//       applicantName,
//       applicantPhone,
//       applicantEmail,
//       currentCompany,
//       candidateWorkLocation,
//       nativeLocation,
//       qualification,
//       experience,
//       skills,
//       noticePeriod,
//       band,
//       dateApplied,
//       positionTitle,
//       positionId,
//       status,
//       stage,
//       dateOfPhoneScreen,
//       interviewDate,
//       dateOfOffer,
//       reasonNotExtending,
//       notes,
//     } = req.body;

//     const profileOwner = req.user.username;
//     const applicantResume = req.file.buffer;

//     // Check for existing records
//     const checkSql = `
//         SELECT COUNT(*) AS count FROM ApplicantTracking
//         WHERE applicantPhone = ? OR applicantEmail = ?
//     `;

//     db.query(checkSql, [applicantPhone, applicantEmail], (err, results) => {
//       if (err) {
//         console.error("Error: " + err.message);
//         return res
//           .status(500)
//           .json({ message: "Error checking for duplicates" });
//       }

//       if (results[0].count > 0) {
//         return res.status(400).json({ message: "User with this Email Or Phone already exists!" });
//       }

//       // If no duplicates found, insert new record
//       const insertSql = `
//             INSERT INTO ApplicantTracking (
//                 profileOwner,
//                 applicantName,
//                 applicantPhone,
//                 applicantEmail,
//                 currentCompany,
//                 candidateWorkLocation,
//                 nativeLocation,
//                 qualification,
//                 experience,
//                 skills,
//                 noticePeriod,
//                 band,
//                 applicantResume,
//                 dateApplied,
//                 positionTitle,
//                 positionId,
//                 status,
//                 stage,
//                 dateOfPhoneScreen,
//                 interviewDate,
//                 dateOfOffer,
//                 reasonNotExtending,
//                 notes
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//       db.query(
//         insertSql,
//         [
//           profileOwner,
//           applicantName,
//           applicantPhone,
//           applicantEmail,
//           currentCompany,
//           candidateWorkLocation,
//           nativeLocation,
//           qualification,
//           experience,
//           skills,
//           noticePeriod,
//           band,
//           applicantResume,
//           dateApplied,
//           positionTitle,
//           positionId,
//           status,
//           stage || null,
//           dateOfPhoneScreen || null,
//           interviewDate || null,
//           dateOfOffer || null,
//           reasonNotExtending || null,
//           notes || null,
//         ],
//         (err, result) => {
//           if (err) {
//             console.error("Error: " + err.message);
//             return res.status(500).json({ errMessage: err.message ,message: "Error submitting form" });
//           }

//           res.status(200).json({ message: "Form submitted successfully" });
//         }
//       );
//     });
//   }
// );

// app.post("/updatePosition", authenticateToken, (req, res) => {
//   const { positionTitle, positionId, description } = req.body;

//   const checkSql = "SELECT * FROM OpenPositions WHERE positionId = ?";
//   db.query(checkSql, [positionId], (err, results) => {
//     if (err) {
//       console.error("Error checking position: " + err.message);
//       return res.status(500).json({ message: "Error checking position" });
//     }

//     if (results.length > 0) {
//       // Position exists, update it
//       const updateSql = `
//                 UPDATE OpenPositions
//                 SET positionTitle = ?,
//                     jobdescription = ?
//                 WHERE positionId = ?
//             `;
//       db.query(
//         updateSql,
//         [positionTitle, positionId, description],
//         (err, result) => {
//           if (err) {
//             console.error("Error updating position: " + err.message);
//             return res.status(500).json({ message: "Error updating position" });
//           }

//           res.status(200).json({ message: "Position updated successfully" });
//         }
//       );
//     } else {
//       // Position does not exist, insert new position
//       const insertSql = `
//                 INSERT INTO OpenPositions (positionId, positionTitle,jobdescription)
//                 VALUES (?, ?, ?)
//             `;
//       db.query(
//         insertSql,
//         [positionId, positionTitle, description],
//         (err, result) => {
//           if (err) {
//             console.error("Error inserting position: " + err.message);
//             return res
//               .status(500)
//               .json({ message: "Error inserting position" });
//           }

//           res.status(200).json({ message: "Position added successfully" });
//         }
//       );
//     }
//   });
// });

app.get("/api/positions", (req, res) => {
  const sql =
    "SELECT positionId, positionTitle, jobdescription FROM OpenPositions where status = 'active'";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching positions: " + err.message);
      return res.status(500).json({ message: "Error fetching positions" });
    }

    res.status(200).json(results);
  });
});

// const nodemailer = require('nodemailer');


app.get("/positions/count", (req, res) => {
  const sql = "SELECT openPositions FROM OpenPositions WHERE status = 'active'";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching count: " + err.message);
      return res.status(500).json({ message: "Error fetching positions" });
    }

    res.status(200).json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// });
app.post("/send-email", authenticateToken, async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    await sendEmailToAdmin(to, subject, text);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});