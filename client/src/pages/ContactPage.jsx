import React, { useState } from 'react';
import emailjs from 'emailjs-com';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.send(
      'YOUR_SERVICE_ID',    // 🔁 Replace with your actual EmailJS service ID
      'YOUR_TEMPLATE_ID',   // 🔁 Replace with your actual EmailJS template ID
      {
        from_name: formData.name,
        from_email: formData.email,
        query_type: formData.type,
        message: formData.message,
      },
      'YOUR_PUBLIC_KEY'     // 🔁 Replace with your EmailJS public key
    )
      .then(() => {
        setSubmitted(true);
        setError('');
        setFormData({
          name: '',
          email: '',
          type: '',
          message: '',
        });
        setTimeout(() => setSubmitted(false), 5000);
      })
      .catch((err) => {
        console.error('EmailJS Error:', err);
        setError('❌ Failed to send message. Please check your network or configuration.');
      });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">
            We’d love to hear from you. Reach out with any questions or feedback.
          </p>
        </div>

        <div className="text-center space-y-2 mb-14">
          <p>Email: <a href="mailto:support@resumatch.com" className="text-blue-600 hover:underline">support@resumatch.com</a></p>
          <p>Phone: +91 98765 43210</p>
          <p>Address: Pune, Maharashtra, India</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Send Us a Message</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Query Type --</option>
              <option value="support">Technical Support</option>
              <option value="feedback">Feedback</option>
              <option value="partnership">Partnership Inquiry</option>
              <option value="other">Other</option>
            </select>
          </div>

          <textarea
            name="message"
            placeholder="Your Message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md transition w-full"
          >
            Send Message
          </button>

          {submitted && (
            <p className="text-green-600 text-center mt-4 font-medium">
              ✅ Your message has been sent successfully!
            </p>
          )}
          {error && (
            <p className="text-red-600 text-center mt-4 font-medium">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ContactPage;
