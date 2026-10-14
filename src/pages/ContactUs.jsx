import { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(() => {
        alert("✅ Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      })
      .catch((error) => {
        console.error("❌ EmailJS error:", error);
        alert("Failed to send message. Please try again later.");
      });
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-xl rounded-2xl border border-zinc-200 overflow-hidden"
        >
          <div className="md:flex">
            {/* Sidebar */}
            <div className="md:w-2/5 bg-black text-white p-10 flex flex-col justify-between border-r border-zinc-900">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-3xl font-black mb-4 tracking-tight"
                >
                  Get in Touch
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mb-8 text-zinc-300 text-sm leading-relaxed"
                >
                  Have questions, custom tool requests, or support needs? Send us a message and we'll reply as soon as possible.
                </motion.p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-6 mt-8 text-sm"
              >
                <div className="flex items-start">
                  <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 mr-3.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Email</h3>
                    <p className="text-zinc-300 text-xs mt-0.5">shippinglabelcrop@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 mr-3.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Location</h3>
                    <p className="text-zinc-300 text-xs mt-0.5">India</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <div className="md:w-3/5 p-8 md:p-10">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-black text-black mb-1.5"
              >
                Send Us a Message
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-zinc-600 text-xs mb-8"
              >
                Fill out the details below and we will reach out shortly.
              </motion.p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <label htmlFor="name" className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      placeholder="Your full name"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <label htmlFor="email" className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      placeholder="your.email@example.com"
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <label htmlFor="subject" className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="What is this regarding?"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <label htmlFor="message" className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-zinc-800 transition-all font-bold text-sm uppercase tracking-wider shadow-sm border border-black cursor-pointer"
                  >
                    Send Message
                  </button>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
