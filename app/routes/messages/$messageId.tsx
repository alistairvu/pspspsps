import type { Message } from '@prisma/client';
import type { ErrorBoundaryComponent, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { messageId } = params;

  const data = await db.message.findFirst({
    where: {
      id: messageId,
    },
  });

  return json(data);
};

const MessagePage = () => {
  const data = useLoaderData<Message>();

  return (
    <>
      <p>{data.message}</p>
      <p>{data.password}</p>
    </>
  );
};

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
  console.error(error);
  return (
    <>
      <p>Message does not exist, please try again.</p>
    </>
  );
};

export default MessagePage;
