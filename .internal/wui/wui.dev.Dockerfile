FROM node:14

WORKDIR /usr/iotstack_wui

# node_modules is ignored with this copy, as specified in .dockerignore
COPY ./wui ./
RUN npm install

EXPOSE 32777
CMD [ "npm", "start" ]
