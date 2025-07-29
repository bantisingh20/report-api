const MessageType = {
  Success: "Success",
  Error: "Error"
};

const ApiHttpUtility = {
  FromResult: (type, message, data, total) => ({
    type,
    message,
    data,
    total
  }),
  MessageType
};

module.exports = ApiHttpUtility;
