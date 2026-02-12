# Lab Test 01  
## Jayden Lewis – 101484621  

## [Demonstration Video](https://www.youtube.com/watch?v=zSHogr8Ffco)

## Overview

This is a real-time chat application built using Node.js, Express, Socket.IO, and MongoDB Atlas.  
Users can sign up, log in, join public chat rooms, and send private messages.  
All messages are stored in MongoDB and retrieved when needed.

---

## Features

### Authentication
- User signup and login  
- Passwords are hashed using bcrypt  
- User session stored in browser storage  

### Public Chat Rooms
- Predefined rooms:
  - devops  
  - cloud computing  
  - covid19  
  - sports  
  - nodeJS  
- Join and leave rooms  
- Send messages in real time  
- Last 50 room messages are retrieved from MongoDB  

### Private Direct Messaging
- Send direct messages to other users  
- Full DM history is retrieved from MongoDB  
- Messages are stored in the `PrivateMessage` collection  

### Real-Time Functionality
- Real-time messaging using Socket.IO  
- Typing indicators for direct messages  
- Online user tracking  
- Ping feature for testing socket connection  

---

## Tech Stack

- Node.js  
- Express  
- Socket.IO  
- MongoDB Atlas  
- Mongoose  
- bcrypt  
