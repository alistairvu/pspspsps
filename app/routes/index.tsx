import {
  Box,
  Button,
  Container,
  Input,
  Textarea,
  Text,
  Link as ChakraLink,
} from '@chakra-ui/react';
import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useActionData, useTransition } from '@remix-run/react';
import { db } from '~/utils/db.server';
import bcrypt from 'bcryptjs';
import { Blowfish } from 'javascript-blowfish';
import { ExternalLinkIcon } from '@chakra-ui/icons';

type ActionData = {
  success: boolean;
  messageId?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const message = body.get('message');
  const password = body.get('password');

  if (typeof message !== 'string' || typeof password !== 'string') {
    throw new Error(`Form not submitted correctly.`);
  }

  const bf = new Blowfish(password);
  const encrypted = bf.base64Encode(bf.encrypt(message));

  const hashedPassword = await bcrypt.hash(password, 10);
  const fields = {
    message: encrypted,
    password: hashedPassword,
  };

  const { id: messageId } = await db.message.create({
    data: fields,
  });

  return json({
    success: true,
    messageId,
  });
};

export default function Index() {
  const transition = useTransition();
  const actionData = useActionData<ActionData>();

  return (
    <Container>
      <Form method="post">
        <Textarea
          placeholder="Write your message here... "
          my={2}
          name="message"
        />
        <Input
          type="password"
          placeholder="Enter a password"
          my={2}
          name="password"
        />
        <Button type="submit" isLoading={transition.state === 'submitting'}>
          {transition.state === 'submitting' ? 'Saving...' : 'Save'}
        </Button>
      </Form>

      {actionData?.messageId && (
        <Box
          p={4}
          my={2}
          color="green.700"
          backgroundColor="green.100"
          rounded="md"
          border="1px"
          borderColor="green.700"
        >
          <Text>
            Successfully added new message. Your message can be found{' '}
            <ChakraLink
              as={Link}
              to={`/messages/${actionData.messageId}`}
              prefetch="intent"
            >
              here
              <ExternalLinkIcon mx="2px" />
            </ChakraLink>
            .
          </Text>
        </Box>
      )}
    </Container>
  );
}

export const handle = { hydrate: true };
