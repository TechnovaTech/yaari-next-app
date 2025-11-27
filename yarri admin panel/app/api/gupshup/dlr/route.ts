import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Save a single event or an array of events safely
async function saveReport(events: unknown) {
  try {
    const client = await clientPromise;
    const db = client.db('yarri');
    const collection = db.collection('delivery_reports');

    if (Array.isArray(events)) {
      const docs = events.map((e) => {
        const base = (typeof e === 'object' && e !== null) ? (e as Record<string, any>) : { value: e };
        return { ...base, receivedAt: new Date() };
      });
      if (docs.length > 0) await collection.insertMany(docs);
    } else if (events !== undefined && events !== null) {
      const base = (typeof events === 'object') ? (events as Record<string, any>) : { value: events };
      await collection.insertOne({ ...base, receivedAt: new Date() });
    }
  } catch (err) {
    console.error('DLR save error:', err);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params: Record<string, string | null> = {};
  url.searchParams.forEach((value, key) => { params[key] = value; });

  console.log('📬 DLR GET', params);
  await saveReport({ type: 'GET', params });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    // Some setups send form-encoded instead of JSON
    if (!body) {
      const text = await req.text();
      console.log('📬 DLR POST (text)', text);
      await saveReport({ type: 'POST_TEXT', text });
      return NextResponse.json({ ok: true });
    }

    // Gupshup may send array: [ { externalId, eventType, ... } ]
    const events = Array.isArray(body.response) ? body.response : (Array.isArray(body) ? body : [body]);
    console.log('📬 DLR POST (json)', events);
    await saveReport(events);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DLR POST error:', err?.message || err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}