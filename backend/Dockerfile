# Sử dụng image Node.js 16 dựa trên Alpine Linux
FROM node:16-alpine

# Tạo thư mục làm việc
WORKDIR /home/node/app

# Copy package.json và package-lock.json vào thư mục làm việc
COPY package*.json ./

USER node
# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code ứng dụng vào thư mục làm việc
COPY --chown=node:node . .

# Set môi trường cho biến NODE_ENV
# ENV NODE_ENV production

# Khởi động server
CMD [ "node", "src/app.js" ]