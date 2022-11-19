import { Button, Container, Input, Textarea } from '@chakra-ui/react';
import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { db } from '~/utils/db.server';
import bcrypt from 'bcryptjs';
import { Blowfish } from 'javascript-blowfish';

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

  const newMessage = await db.message.create({
    data: fields,
  });

  return redirect(`/messages/${newMessage.id}`);
};

export default function Index() {
  return (
    <Container>
      <Form method="post">
        <Textarea
          placeholder="Add your message here... "
          my={2}
          name="message"
        />
        <Input
          type="password"
          placeholder="Enter your password"
          my={2}
          name="password"
        />
        <Button type="submit">Save</Button>
      </Form>
    </Container>
  );
}
