import { Box, Heading } from '@chakra-ui/react';
import { Link } from '@remix-run/react';

const AppHeader = () => (
  <>
    <Box textAlign={'center'} px="4" py="2">
      <Link to="/" prefetch="render">
        <Heading color="green.500">pspspsps</Heading>
      </Link>
    </Box>
  </>
);

export default AppHeader;
