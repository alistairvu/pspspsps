import { Box, Link as ChakraLink } from '@chakra-ui/react';
import { Link } from '@remix-run/react';

const AppFooter = () => (
  <>
    <Box textAlign={'center'} my="2">
      [
      <ChakraLink as={Link} to="/" prefetch="intent" color="green.500">
        write something
      </ChakraLink>
      ]
    </Box>
  </>
);

export default AppFooter;
