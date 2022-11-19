import {
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
} from '@chakra-ui/react';
import type {
  ActionFunction,
  ErrorBoundaryComponent,
  LoaderFunction,
} from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';
import bcrypt from 'bcryptjs';
import { Blowfish } from 'javascript-blowfish';
import { passwordCookie } from '~/cookies';

export const loader: LoaderFunction = async ({ params, request }) => {
  const { messageId } = params;

  const data = await db.message.findFirst({
    where: {
      id: messageId,
    },
  });

  if (data === null) {
    throw new Error(`No matching message.`);
  }

  const cookieHeader = request.headers.get('Cookie');
  const cookie = (await passwordCookie.parse(cookieHeader)) || {};

  if (cookie[`${messageId}-password`] === undefined) {
    return json({
      isUnlocked: false,
    });
  }

  const password = cookie[`${messageId}-password`];
  const isMatch = await bcrypt.compare(password, data.password);

  if (!isMatch) {
    return json({
      isUnlocked: false,
    });
  }

  const bf = new Blowfish(password);
  const message = bf.decrypt(bf.base64Decode(data.message));
  cookie[`${messageId}-password`] = undefined;

  return json(
    {
      isUnlocked: true,
      message,
    },
    {
      headers: {
        // only necessary with cookieSessionStorage
        'Set-Cookie': await passwordCookie.serialize(cookie),
      },
    }
  );
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const password = formData.get('password');
  const { messageId } = params;

  if (typeof password !== 'string') {
    throw new Error(`Form not submitted correctly.`);
  }

  const data = await db.message.findFirst({
    where: {
      id: messageId,
    },
  });

  if (data === null) {
    throw new Error(`No matching message.`);
  }

  const isMatch = await bcrypt.compare(password, data.password);

  if (!isMatch) {
    return json({
      error: 'Password mismatch',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const cookie = (await passwordCookie.parse(cookieHeader)) || {};

  cookie[`${messageId}-password`] = password;

  return redirect(`/messages/${messageId}`, {
    headers: {
      'Set-Cookie': await passwordCookie.serialize(cookie),
    },
  });
};

type ActionData = {
  error?: string;
};

type LoaderData = {
  isUnlocked: boolean;
  message?: string;
};

const MessagePage = () => {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  if (loaderData.isUnlocked) {
    return (
      <>
        <Text>{loaderData?.message}</Text>
      </>
    );
  }

  return (
    <>
      <Form method="post">
        <FormControl isInvalid={typeof actionData?.error === 'string'}>
          <Input type="password" placeholder="Enter password" name="password" />
          {actionData?.error && (
            <FormErrorMessage>{actionData?.error}</FormErrorMessage>
          )}
        </FormControl>
        <Button type="submit">Unlock message</Button>
      </Form>
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
