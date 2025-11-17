import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { prices, auto_distribution_approved } = body;

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        { error: '올바른 요청 데이터가 아닙니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update client's auto distribution approval status if provided
    if (typeof auto_distribution_approved === 'boolean') {
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ auto_distribution_approved })
        .eq('id', id);

      if (clientUpdateError) {
        console.error('Error updating client approval status:', clientUpdateError);
        return NextResponse.json(
          { error: `승인 상태 업데이트 중 오류가 발생했습니다: ${clientUpdateError.message}` },
          { status: 500 }
        );
      }
    }

    // Delete existing prices for this client
    await supabase
      .from('client_product_prices')
      .delete()
      .eq('client_id', id);

    // Insert new prices
    const priceRecords = prices
      .filter((p) => p.price_per_unit > 0) // Only insert if price > 0
      .map((p) => ({
        client_id: id,
        category_id: p.category_id,
        price_per_unit: p.price_per_unit,
        is_visible: p.is_visible,
      }));

    console.log('[DEBUG] Price records to insert:', JSON.stringify(priceRecords, null, 2));

    if (priceRecords.length > 0) {
      const { error } = await supabase
        .from('client_product_prices')
        .insert(priceRecords);

      if (error) {
        console.error('Error inserting prices:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { error: `가격 설정 중 오류가 발생했습니다: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/clients/[id]/pricing:', error);
    return NextResponse.json(
      { error: '가격 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
