import Editor from '@/components/Editor';

export default async function Page({ params }) {
  const { id } = await params;
  return <Editor tid={id} />;
}
