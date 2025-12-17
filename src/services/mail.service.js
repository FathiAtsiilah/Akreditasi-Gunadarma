const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs-extra");

class MailService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        return nodemailer.createTransport({
            service: process.env.MAIL_SERVICE ?? "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_APP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
            debug: true,
            logger: true,
        });
    }

    async compileTemplate(templateName, context, platform) {
        try {
            const templatePath = path.resolve(
                __dirname,
                `../templates/mail/${platform}/${templateName}.hbs`
            );
            const templateSource = await fs.readFile(templatePath, "utf-8");
            const template = handlebars.compile(templateSource);
            return template(context);
        } catch (error) {
            console.error("Error loading email template:", error);
            throw new Error("Template not found or failed to compile.");
        }
    }

    async sendMail(options) {
        const { to, subject, text, template, context, platform } = options;
        let html = options.html ?? undefined;

        if (template && context && platform) {
            html = await this.compileTemplate(template, context, platform);
        }

        const mailOptions = {
            from: process.env.MAIL_FROM ?? "admin",
            to,
            subject,
            text,
            html,
        };

        await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new MailService();