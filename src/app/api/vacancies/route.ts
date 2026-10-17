import { NextResponse } from 'next/server';
import { fetchVacanciesList } from '@/lib/vacancies';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const query = searchParams.get('q');

    const vacancies = await fetchVacanciesList(typeFilter, query);
    return NextResponse.json({ vacancies });
  } catch (err) {
    console.error('Failed to list vacancies:', err);
    return NextResponse.json({ error: 'Failed to list vacancies' }, { status: 500 });
  }
}
