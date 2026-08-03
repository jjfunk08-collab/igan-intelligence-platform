import { getIndication } from "../../../lib/config";
import { removeSubscriber } from "../../../lib/subscribers";

// Plain HTML response (not JSON) since this is opened directly from an email
// link in a browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const slug = searchParams.get("i");
  const area = getIndication(slug);

  if (!token || !area) {
    return html("That unsubscribe link looks incomplete or invalid.", 400);
  }

  try {
    await removeSubscriber(area.slug, token);
    return html(`You've been unsubscribed from the ${area.label} brief. You won't receive any more emails for this program.`);
  } catch (err) {
    return html(err.message || "Something went wrong removing your subscription.", 500);
  }
}

function html(message, status = 200) {
  return new Response(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f6fa;padding:60px 20px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #dbe3ee;border-radius:10px;padding:28px;">
        <p style="margin:0;font-size:15px;color:#17233a;line-height:1.5;">${escapeHtml(message)}</p>
      </div>
    </body></html>`,
    { status, headers: { "content-type": "text/html" } }
  );
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
