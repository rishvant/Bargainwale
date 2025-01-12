import Mail from "../models/mail.js";
import sender from "../config/emailConfig.js"; 

// Function to send an email
export const sendEmail = async (req, res) => {
  try {
    // console.log(req.body);
    const { recipient, subject, body, transactionDetails } = req.body;

    if (
      !recipient ||
      !recipient.email ||
      !subject ||
      !body ||
      !transactionDetails
    ) {
      return res
        .status(400)
        .json({
          message:
            "Missing required fields (recipient, subject, body, or transactionDetails).",
        });
    }

    const result = await sendEmailWithParams(
      {body,
      subject,
      recipient,
      transactionDetails}
    );

    return res.status(200).json({ message: "Email sent successfully", result });
  } catch (error) {
    console.error("Error in sendEmail controller:", error.message || error);

    return res
      .status(500)
      .json({ message: "Failed to send email", error: error.message || error });
  }
};

export const sendEmailWithParams = async (
  {body,
  subject,
  recipient,
  transactionDetails}
) => {

    // console.log(body,subject,recipient,transactionDetails);
  let email;

  try {
    // Create a new email document in the database
    email = new Mail({
      recipient,
      subject,
      body,
      transactionDetails,
    });
    await email.save();
    // Send the email using the configured sender
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient.email,
      subject,
      html: body,
    };
    // console.log(sender);

    await sender.sendMail(mailOptions);

    // Update the email status and sentAt timestamp
    email.status = "sent";
    email.sentAt = new Date();
    await email.save();

    return { message: "Email sent successfully", email };
  } catch (error) {
    console.error("Error sending email:", error);

    // Handle the case where the email was not found or created
    if (!email) {
      email = new Mail({
        recipient,
        subject,
        body,
        transactionDetails,
        status: "failed",
        attempts: 1,
      });
    } else {
      email.status = "failed";
      email.attempts += 1;
    }
    await email.save();

    throw new Error("Failed to send email");
  }
};

// Function to retry sending failed emails
export const retryFailedEmails = async (req, res) => {
  try {
    const failedEmails = await Mail.find({
      status: "failed",
      attempts: { $lt: 3 },
    });

    if (failedEmails.length === 0) {
      return res.status(200).json({ message: "No failed emails to retry" });
    }

    const results = [];
    for (const email of failedEmails) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email.recipient.email,
          subject: email.subject,
          html: email.body,
        };

        await sender.sendMail(mailOptions);

        // Update email status to sent
        email.status = "sent";
        email.sentAt = new Date();
        await email.save();

        results.push({ emailId: email._id, status: "sent" });
      } catch (retryError) {
        email.attempts += 1;
        email.errorMessage = retryError.message;
        await email.save();

        results.push({
          emailId: email._id,
          status: "failed",
          error: retryError.message,
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Retry process completed", results });
  } catch (error) {
    console.error("Error retrying emails:", error);
    return res.status(500).json({ message: "Failed to retry emails", error });
  }
};

// Get all emails
export const getAllEmails = async (req, res) => {
  try {
    const emails = await Mail.find().sort({ createdAt: -1 });
    return res.status(200).json({ emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return res.status(500).json({ message: "Failed to fetch emails", error });
  }
};

// Get email by ID
export const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await Mail.findById(id);

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    return res.status(200).json({ email });
  } catch (error) {
    console.error("Error fetching email:", error);
    return res.status(500).json({ message: "Failed to fetch email", error });
  }
};
