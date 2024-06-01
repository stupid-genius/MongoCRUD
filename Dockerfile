FROM node:gallium-alpine
WORKDIR /opt/mongocrud
ENV NODE_ENV=production
COPY dist/ serve.sh .
RUN npm ci
EXPOSE 3000
CMD ["sh", "serve.sh"]
