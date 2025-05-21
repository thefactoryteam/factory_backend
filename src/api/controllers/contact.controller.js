import asyncHandler from "express-async-handler"
import { saveContactToDatabase, sendNotificationEmail } from "../../services/contact.service.js";

export const addContact = asyncHandler(async (req, res, next) => {
    const { firstname, lastname, company, email, message } = req.body;

    // Create contact data object
    const contactData = {
        firstname,
        lastname,
        company,
        email,
        message
    };

    // Save to database
    const contactId = await saveContactToDatabase(contactData);

    // Send notification email
    // await sendNotificationEmail(contactData);

    // Return success response with contactId
    return res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        contactId
    });

})