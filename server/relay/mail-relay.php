<?php
/**
 * mail-relay.php — send mail from a host that cannot open SMTP.
 *
 * Render blocks outbound SMTP: ports 465 and 587 both time out, while the same
 * credentials work from anywhere else. Port 443 is open, so the API posts here
 * and this file — which sits on the same machine as the mailbox — does the send
 * locally, where no firewall sits between.
 *
 * Nothing third-party is involved: your hosting, your domain, your mailbox.
 *
 * ── INSTALL ────────────────────────────────────────────────────────────────
 * 1. Pick a long random secret:
 *        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 2. Put it in MAIL_RELAY_SECRET below, replacing the placeholder.
 * 3. Upload this file to public_html on the ailernova.in hosting. Give it an
 *    unguessable name — mail-relay-a94f2c.php, not mail-relay.php. Obscurity is
 *    not the security here (the secret is), but it keeps the URL out of scans.
 * 4. Set on Render:
 *        MAIL_RELAY_URL    = https://ailernova.in/<that-filename>.php
 *        MAIL_RELAY_SECRET = <the same secret>
 *
 * ── WHY THE SECRET IS NOT OPTIONAL ─────────────────────────────────────────
 * Without it this URL is an open relay: anyone who finds it can send mail as
 * your domain, and your domain wears the reputation damage. The comparison uses
 * hash_equals so a wrong key cannot be recovered by timing the response.
 */

declare(strict_types=1);

const MAIL_RELAY_SECRET = 'REPLACE_ME_WITH_A_LONG_RANDOM_STRING';

// The only address this relay will ever send AS. A caller cannot choose it:
// letting the From come from the request is what turns a relay into a spoofing
// service even when the secret holds.
const MAIL_FROM_ADDRESS = 'support@ailernova.in';
const MAIL_FROM_NAME    = 'Ailernova';

header('Content-Type: application/json');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'POST only');
}

// Reject before reading the body: an unauthenticated caller should not be able
// to make this process parse arbitrary input.
$key = $_SERVER['HTTP_X_RELAY_KEY'] ?? '';
if (MAIL_RELAY_SECRET === 'REPLACE_ME_WITH_A_LONG_RANDOM_STRING') {
    fail(500, 'relay not configured');
}
if (!is_string($key) || !hash_equals(MAIL_RELAY_SECRET, $key)) {
    fail(401, 'bad key');
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 200000) {
    fail(413, 'body missing or too large');
}
$body = json_decode($raw, true);
if (!is_array($body)) {
    fail(422, 'body must be JSON');
}

$to      = trim((string)($body['to'] ?? ''));
$subject = trim((string)($body['subject'] ?? ''));
$html    = (string)($body['html'] ?? '');
$text    = (string)($body['text'] ?? '');

if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'valid "to" required');
}
if ($subject === '') {
    fail(422, '"subject" required');
}
if ($html === '' && $text === '') {
    fail(422, 'one of "html" or "text" required');
}

// A newline in either of these would let a caller inject extra headers — Bcc to
// a list, a different From — through a field that looks like plain text. The
// address is validated above; the subject is encoded rather than trusted.
if (preg_match('/[\r\n]/', $to)) {
    fail(422, 'invalid "to"');
}
$subjectHeader = mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");

$boundary = 'b' . bin2hex(random_bytes(12));
$from     = sprintf('%s <%s>', MAIL_FROM_NAME, MAIL_FROM_ADDRESS);

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'From: ' . $from,
    'Reply-To: ' . MAIL_FROM_ADDRESS,
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
]);

// Plain text first: a multipart/alternative is read last-part-first, so the
// order decides which one a client shows. Text is not a fallback to neglect —
// plenty of people read mail as text, and an HTML-only message reads to them as
// an empty envelope.
$parts = [];
if ($text !== '') {
    $parts[] = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: base64\r\n\r\n"
             . chunk_split(base64_encode($text));
}
if ($html !== '') {
    $parts[] = "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: base64\r\n\r\n"
             . chunk_split(base64_encode($html));
}
$message = implode('', $parts) . "--$boundary--";

// -f sets the envelope sender, which is what SPF is checked against. Without it
// the host sends as the account's default and the alignment can fail.
$sent = mail($to, $subjectHeader, $message, $headers, '-f' . MAIL_FROM_ADDRESS);

if (!$sent) {
    error_log('[mail-relay] mail() returned false for ' . $to);
    fail(502, 'the mail server rejected the message');
}

echo json_encode(['ok' => true, 'id' => $boundary]);
