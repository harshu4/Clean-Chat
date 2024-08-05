import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import ChatLoading from "./ChatLoading";

const OnlineUsers = ({ fetchAgain }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user,externalUsers,setExternalusers } = ChatState();

  const toast = useToast();

  const fetchOnlineUsers = async () => {
    console.log("online users fetched")
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat/online", config);
      setOnlineUsers(data);
      setExternalusers(data);
    
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the online users",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    fetchOnlineUsers(); // Fetch immediately on mount

    const interval = setInterval(fetchOnlineUsers, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchAgain]);

  return (
    <Box
      d="flex"
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w="30%"
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        d="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        Online Users
        <Button
          onClick={fetchOnlineUsers}
          fontSize={{ base: "17px", md: "10px", lg: "17px" }}
        >
          Refresh
        </Button>
      </Box>
      <Box
        d="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {onlineUsers.length > 0 ? (
          <Stack overflowY="scroll">
            {onlineUsers.map((user) => (
              <Box
                cursor="pointer"
                bg="#E8E8E8"
                px={3}
                py={2}
                borderRadius="lg"
                key={user._id}
              >
                <Text>
                 
                  {user.name}
                </Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default OnlineUsers;
