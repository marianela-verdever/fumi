import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Weekly reminder cron job — runs every Monday at 10am UTC.
 * Finds users who haven't added entries in 7+ days.
 *
 * Currently logs results. Email sending will be enabled
 * once custom SMTP is configured (Resend with own domain).
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role for admin access (no user session in cron)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all babies with their latest entry date
  const { data: babies, error: babiesError } = await supabase
    .from("babies")
    .select("id, name, user_id");

  if (babiesError || !babies) {
    return NextResponse.json({ error: "Failed to fetch babies" }, { status: 500 });
  }

  const reminders: Array<{ userId: string; babyName: string; daysSinceEntry: number }> = [];

  for (const baby of babies) {
    const { data: latestEntry } = await supabase
      .from("entries")
      .select("created_at")
      .eq("baby_id", baby.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const lastDate = latestEntry?.created_at
      ? new Date(latestEntry.created_at)
      : null;

    if (!lastDate || lastDate < sevenDaysAgo) {
      const daysSince = lastDate
        ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      reminders.push({
        userId: baby.user_id,
        babyName: baby.name,
        daysSinceEntry: daysSince,
      });
    }
  }

  // TODO: Send emails when custom SMTP is configured
  // For now, just log the reminders
  console.log(`[weekly-reminder] ${reminders.length} users need reminders:`, reminders);

  return NextResponse.json({
    processed: babies.length,
    remindersNeeded: reminders.length,
    reminders,
  });
}
