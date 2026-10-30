import ejs from "ejs";
import path from "node:path";
import nodemailer from "nodemailer";

import config from "../../config";

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: config.smtp_user,
		pass: config.smtp_password,
	},
});

const renderTemplate = async (
	templateName: string,
	data: Record<string, unknown>,
) => {
	const templatePath = path.join(
		process.cwd(),
		"src",
		"services",
		"mail",
		"templates",
		templateName,
	);

	return ejs.renderFile(templatePath, data);
};

const sendEmail = async ({
	to,
	subject,
	html,
}: {
	to: string;
	subject: string;
	html: string;
}) => {
	await transporter.sendMail({
		from: `"Vaulty" <${config.smtp_user}>`,
		to,
		subject,
		html,
	});
};

const sendPasswordResetOtpEmail = async ({
	to,
	name,
	otp,
}: {
	to: string;
	name: string;
	otp: string;
}) => {
	const html = await renderTemplate("reset-password.ejs", {
		name,
		otp,
	});

	await sendEmail({
		to,
		subject: "Your Vaulty password reset code",
		html,
	});
};
const sendEmailVerificationOtpEmail = async ({
	to,
	name,
	otp,
}: {
	to: string;
	name: string;
	otp: string;
}) => {
	const html = await renderTemplate("verify-email.ejs", {
		name,
		otp,
	});

	await sendEmail({
		to,
		subject: "Verify your Vaulty email address",
		html,
	});
};
export const mailService = {
	sendEmail,
	sendPasswordResetOtpEmail,
	sendEmailVerificationOtpEmail,
};