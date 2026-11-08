const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendMail } = require('./mailer');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const EMAIL_TYPES = ['adoption_request', 'request_update'];

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Save notifications, push them in real time, and email important ones
async function notifyUsers(io, userIds, { type, title, body, link }) {
  if (!userIds.length) return;
  const docs = await Notification.insertMany(userIds.map((user) => ({ user, type, title, body, link })));
  docs.forEach((doc) => io.to(`user:${doc.user}`).emit('notification:new', doc));

  if (EMAIL_TYPES.includes(type)) {
    const users = await User.find({ _id: { $in: userIds } }).select('email name');
    users.forEach((u) =>
      sendMail({
        to: u.email,
        subject: title,
        html: `<p>Hi ${esc(u.name)},</p><p><strong>${esc(title)}</strong></p><p>${esc(body)}</p><p><a href="${CLIENT_URL}${link}">Open PawHome</a></p>`,
      })
    );
  }
}

module.exports = { notifyUsers };
