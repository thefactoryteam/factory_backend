import Contact from "../models/contactForm.model.js";

// Save contact form data to database
export const saveContactToDatabase = async (contactData) => {
    try {
      const newContact = new Contact({
        firstname: contactData.firstname,
        lastname: contactData.lastname,
        company: contactData.company || undefined,
        email: contactData.email,
        message: contactData.message
      });
      
      await newContact.save();
      return newContact._id;
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    } 
  }


  // Send notification email
export const sendNotificationEmail = async(contactData) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `New Contact Form Submission: ${contactData.firstname} ${contactData.lastname}`,
      text: `
        New contact form submission:
        
        Name: ${contactData.firstname} ${contactData.lastname}
        Company: ${contactData.company || 'N/A'}
        Email: ${contactData.email}
        
        Message:
        ${contactData.message}
        
        Submitted on: ${new Date().toLocaleString()}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.firstname} ${contactData.lastname}</p>
        <p><strong>Company:</strong> ${contactData.company || 'N/A'}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <h3>Message:</h3>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
      `
    };
    
    return transporter.sendMail(mailOptions);
  }