# Billraklo Privacy Policy

**Last updated: November 25, 2026**

## 1. About Billraklo

Billraklo is operated by **Prajwal B M** ("Billraklo", "we", "us", or "our"). It helps chartered accountants and bookkeeping professionals collect client bills through WhatsApp or the web application, extract invoice details, review bills by client, and export reports.

This policy explains how we handle information about website visitors, account holders, clients registered by account holders, and people who contact our WhatsApp business number. It covers our website, application, WhatsApp integration, and related support communications.

For privacy questions or requests, email **[bmprajwaldvg@gmail.com](mailto:bmprajwaldvg@gmail.com)**.

## 2. Current testing notice

**Billraklo is currently being tested and uses the unpaid Google Gemini API for document processing. Do not submit real client invoices, personal information, or confidential business documents during this testing phase. Use synthetic sample documents that do not contain information about real people or confidential businesses.**

Documents submitted for processing are sent to Google. Under the terms applicable to our current unpaid Gemini API usage, Google may use inputs and generated outputs to improve its products and machine-learning technologies, and human reviewers may process that content. Google's terms prohibit submitting sensitive, confidential, or personal information to unpaid services. This notice does not make such submissions permissible.

If you have already submitted real or confidential information, contact us using the deletion instructions below. We will update this policy when our processing arrangements change before accepting real client documents for normal use.

## 3. Information we collect

### Account and sign-in information

When you create or use an account, we process your name, email address, verification status, account identifiers, and authentication records. Depending on your sign-in method, these records can include a hashed password, verification records, session tokens, and linked sign-in credentials. If you sign in with Google, we receive information such as your Google account identifier, name, email address, and profile image, together with the credentials needed to support that sign-in.

Sessions may also record your IP address, browser or device information, and sign-in and expiry timestamps.

### Client information

Account holders can register clients by providing a legal or business name, GST identification number (GSTIN), and WhatsApp phone number. We associate each client with the account holder who registered them. Clients may therefore have information in Billraklo without having a separate Billraklo login.

### WhatsApp communications

When someone contacts our business number, Meta sends us relevant message events. These can include a WhatsApp phone number or identifier, profile information supplied in the event, message text, images or PDF attachments, message and media identifiers, timestamps, and delivery or read statuses. We also process the service messages we send and any messaging errors.

The integration receives messages sent to our business number; it does not give Billraklo access to your unrelated private WhatsApp conversations or your phone's entire contact list.

### Documents and extracted information

We process uploaded or forwarded document files and information contained in them. This may include supplier and buyer details, GSTINs, invoice numbers and dates, item descriptions, HSN codes, tax rates, taxable values, and invoice totals. Any additional information visible in a submitted document may also be processed by the extraction service.

We store original files, extracted results, corrections made during review, processing and review timestamps, confidence indicators, file hashes used to identify duplicates, and processing errors. The testing restrictions in section 2 apply to all submitted documents.

### Operational records

We process technical logs and support communications to operate and troubleshoot the service. The current testing implementation logs incoming WhatsApp webhook payloads, which can include message content, phone numbers, and related identifiers. Development-mode email logs may also contain verification codes. These logs are another reason not to use real client data during testing.

## 4. How we use information

We use information to:

- Create and authenticate accounts, maintain sessions, and send verification or password-reset emails.
- Associate incoming bills with the registered client and their accountant's account.
- Receive and store documents, identify duplicates, check whether files are processable, and extract invoice details.
- Let account holders view original documents, correct extracted details, confirm bills, and export reports.
- Send WhatsApp welcome messages, processing updates, extracted invoice summaries, and error notifications.
- Diagnose failures, secure the service, respond to support and privacy requests, and meet applicable legal obligations.

AI extraction can make mistakes. Account holders should review extracted information against the original document before relying on it for accounting or tax work. The extraction feature does not itself file tax returns or make eligibility or credit decisions.

## 5. Who receives information

**Your accountant or account holder.** Documents received from a registered client are associated with that client's account holder, who can view and review them and export the resulting records. Extracted information may also be sent back to the client's registered WhatsApp number. Exported copies are controlled by the person who downloads them.

**Service providers.** The application uses these services to carry out its functions:

| Service | Purpose and information involved |
| --- | --- |
| Meta / WhatsApp Business Platform | Sending and receiving messages, attachments, phone identifiers, and message-status events. |
| Google Gemini API | Checking and extracting information from document images and PDFs, including document content and generated results. See the unpaid-service notice in section 2. |
| Supabase Storage and database infrastructure | Storing original document files and application records. The application uses PostgreSQL for account, client, and invoice records. |
| Google Sign-In | Authenticating users who choose Google sign-in and providing associated profile and sign-in information. |
| Resend | Delivering account emails, including the recipient's email address and verification or password-reset message content. |
| Application hosting, background-job, and logging infrastructure | Running the application, processing jobs, and maintaining operational records. |

Providers may process information in countries other than your own, depending on the infrastructure and service configuration. Their retention and other processing practices are also governed by their applicable terms and privacy policies.

We do not sell personal information. We may disclose information when required by law or when necessary to investigate misuse or protect the service and its users. We do not make client bills publicly available as part of the normal application workflow.

## 6. Cookies and browser storage

Billraklo uses authentication cookies to keep you signed in and support account security. It also stores interface preferences, such as your selected theme, in browser storage. Blocking authentication cookies can prevent sign-in from working. Clearing cookies or browser storage does not delete documents or account information stored on our servers.

## 7. Storage, security, and retention

The application uses authenticated sessions and account-level access checks to restrict access to client records. It verifies incoming WhatsApp webhook signatures and supports time-limited links for accessing stored documents. No method of storage or transmission is completely secure.

**The current release does not automatically delete invoices or client records after a fixed period.** Stored documents, extracted results, and related records remain until a deletion request is reviewed and carried out, or they are otherwise removed by the operator. Authentication sessions and verification codes have expiry periods; their expiry does not delete the associated account or bills.

Logs, backups, and records held by external providers can have separate retention periods. We do not promise immediate removal from every backup or external system. If a request cannot be fulfilled in full, we will explain the relevant limitation, including any legal reason for retaining particular records.

## 8. Access, correction, and deletion requests

You can request access to, correction of, or deletion of your personal information whether or not you have a Billraklo account.

1. Email **[bmprajwaldvg@gmail.com](mailto:bmprajwaldvg@gmail.com)** with the subject **"Billraklo data deletion request"** or a description of your other privacy request.
2. Include the account email address or WhatsApp number, with country code, associated with the information. If relevant, identify the accountant or client account involved and describe whether you want particular documents or all associated information removed.
3. Do not send passwords, verification codes, full payment-card details, or additional copies of sensitive documents. We may ask for limited information to verify your identity and your authority to make the request.

Deletion requests are currently handled manually. We will review a verified request and coordinate removal of the relevant account or client records, stored files, and extracted information where appropriate, subject to applicable legal requirements and the rights of others. We will respond within the period required by applicable law and explain any information we need or any reason we cannot fully carry out a request.

Deleting a WhatsApp chat, signing out, or disconnecting a Google account does not automatically delete Billraklo's stored records. Deleting a client in the dashboard is currently restricted when bills remain associated with that client; use the email process for broader deletion requests.

Deletion from Billraklo does not automatically remove copies already exported by an accountant or records independently retained by Meta, Google, or another provider. We can explain which parties may need to be contacted separately.

You may also ask us to stop WhatsApp service communications by contacting the email address above, or block the business number in WhatsApp. Stopping messages is separate from deleting previously stored information. There is currently no automated in-chat deletion command.

## 9. Account holders and client permissions

Account holders must have appropriate authority and provide the necessary notices and permissions before registering a client's number or submitting information on another person's behalf. Registering a client does not by itself establish that the client has agreed to receive WhatsApp messages. The current testing restrictions still apply even if an account holder has obtained a client's permission.

Account holders may have their own responsibilities for the records they manage and copies they export. Clients may contact both their accountant and Billraklo about those records.

## 10. Children

Billraklo is intended for adult business users and is not intended for people under 18. Do not submit children's personal information. Contact us if you believe such information has been provided so we can review and address it.

## 11. Policy changes

We may update this policy as the application, providers, or data practices change. The updated version will show a revised date. Where required, we will provide additional notice or obtain permission before materially changing how personal information is used.

## 12. Contact and provider information

**Operator:** Prajwal B M, operating Billraklo  
**Privacy and support email:** [bmprajwaldvg@gmail.com](mailto:bmprajwaldvg@gmail.com)

For the providers' own practices, see:

- [WhatsApp Privacy Policy](https://www.whatsapp.com/legal/privacy-policy)
- [Meta Privacy Policy](https://www.facebook.com/privacy/policy/)
- [Google Privacy Policy](https://policies.google.com/privacy)
- [Gemini API Additional Terms of Service](https://aistudio.google.com/docs/terms)
- [Supabase Privacy Policy](https://supabase.com/privacy)
- [Resend Privacy Policy](https://resend.com/legal/privacy-policy)
