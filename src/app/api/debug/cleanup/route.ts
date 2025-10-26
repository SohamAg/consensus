import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { serverClient } from '@/lib/stream';

/**
 * DELETE /api/debug/cleanup
 * Delete all rooms and their data
 */
export async function DELETE() {
  try {
    const supabase = supabaseServer();

    console.log('\n' + '='.repeat(80));
    console.log('🧹 CLEANUP - Deleting all rooms');
    console.log('='.repeat(80));

    // Get all rooms
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id');

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ 
        message: 'No rooms to delete',
        deleted: 0 
      });
    }

    console.log(`Found ${rooms.length} rooms to delete`);

    // Delete all messages
    await supabase.from('messages').delete().neq('id', '0');
    console.log('✅ Deleted all messages');

    // Delete all interventions
    await supabase.from('interventions').delete().neq('id', '0');
    console.log('✅ Deleted all interventions');

    // Delete all rooms
    for (const room of rooms) {
      try {
        const channel = serverClient.channel('messaging', room.id);
        await channel.delete();
      } catch (e) {
        console.log(`Note: Stream channel ${room.id} already deleted`);
      }
    }

    await supabase.from('rooms').delete().neq('id', '');
    console.log('✅ Deleted all rooms');

    console.log('='.repeat(80));
    console.log('✅ Cleanup complete!');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({ 
      success: true,
      deleted_rooms: rooms.length,
      message: 'All rooms and data deleted'
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

