package mail

import (
	"bytes"
	"fmt"
	"mime/quotedprintable"
	"net"
	"net/smtp"
	"strings"

	"github.com/waylen888/tab-buddy/config"
)

type Sender struct {
	hostport string
	username string
	password string
}

func NewSender(cfg config.SMTPSetting) *Sender {
	return &Sender{
		hostport: cfg.Host,
		username: cfg.Username,
		password: cfg.Password,
	}
}

func (sender Sender) SendMail(dest []string, subject, bodyMessage string) error {
	msg := "From: " + sender.username + "\n" +
		"To: " + strings.Join(dest, ",") + "\n" +
		"Subject: " + subject + "\n" + bodyMessage
	host, _, err := net.SplitHostPort(sender.hostport)
	if err != nil {
		return fmt.Errorf("split host port: %w", err)
	}
	return smtp.SendMail(
		sender.hostport,
		smtp.PlainAuth("", sender.username, sender.password, host),
		sender.username,
		dest,
		[]byte(msg),
	)
}

func (sender Sender) WriteEmail(dest []string, contentType, subject, bodyMessage string) string {
	header := make(map[string]string)
	header["From"] = sender.username

	receipient := ""

	for _, user := range dest {
		receipient = receipient + user
	}

	header["To"] = receipient
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = fmt.Sprintf("%s; charset=\"utf-8\"", contentType)
	header["Content-Transfer-Encoding"] = "quoted-printable"
	header["Content-Disposition"] = "inline"

	message := ""

	for key, value := range header {
		message += fmt.Sprintf("%s: %s\r\n", key, value)
	}

	var encodedMessage bytes.Buffer

	finalMessage := quotedprintable.NewWriter(&encodedMessage)
	finalMessage.Write([]byte(bodyMessage))
	finalMessage.Close()

	message += "\r\n" + encodedMessage.String()

	return message
}

func (sender *Sender) WriteHTMLEmail(dest []string, subject, bodyMessage string) string {
	return sender.WriteEmail(dest, "text/html", subject, bodyMessage)
}

func (sender *Sender) WritePlainEmail(dest []string, subject, bodyMessage string) string {
	return sender.WriteEmail(dest, "text/plain", subject, bodyMessage)
}
