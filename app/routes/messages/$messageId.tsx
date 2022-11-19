import {
  Button,
  Container,
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
import { Form, useLoaderData, useTransition } from '@remix-run/react';
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
    cookie[`${messageId}-password`] = undefined;

    return json({
      isUnlocked: false,
      error: 'Wrong password',
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

  const cookieHeader = request.headers.get('Cookie');
  const cookie = (await passwordCookie.parse(cookieHeader)) || {};

  cookie[`${messageId}-password`] = password;

  return redirect(`/messages/${messageId}`, {
    headers: {
      'Set-Cookie': await passwordCookie.serialize(cookie),
    },
  });
};

type LoaderData = {
  isUnlocked: boolean;
  message?: string;
  error?: string;
};

const MessagePage = () => {
  const loaderData = useLoaderData<LoaderData>();
  const transition = useTransition();

  if (loaderData.isUnlocked) {
    return (
      <Container>
        <Text whiteSpace="pre-wrap">{loaderData?.message}</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Form method="post">
        <FormControl isInvalid={typeof loaderData?.error === 'string'}>
          <Input
            type="password"
            placeholder="Enter password"
            name="password"
            my={2}
          />
          {loaderData?.error && (
            <FormErrorMessage>{loaderData?.error}</FormErrorMessage>
          )}
        </FormControl>
        <Button type="submit" isLoading={transition.state === 'submitting'}>
          Unlock message
        </Button>
      </Form>
    </Container>
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

export const handle = { hydrate: true };
