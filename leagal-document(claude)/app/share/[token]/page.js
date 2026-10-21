import SharedDoc from '@/components/SharedDoc';

export default async function Page({ params }) {
  const { token } = await params;
  return <SharedDoc token={token} />;
}
