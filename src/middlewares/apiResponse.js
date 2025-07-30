// const MessageType = {
//   Success: "Success",
//   Error: "Error"
// };

// const ApiHttpUtility = {
//   FromResult: (type, message, data, total=0,pagination = null) => ({
//     type,
//     message,
//     data,
//     total,
//     ...(pagination && { pagination }), 
//   }),
//   MessageType
// };


// module.exports = ApiHttpUtility;


const MessageType = {
  Success: "Success",
  Error: "Error"
};

const ApiHttpUtility = {
  MessageType,

  FromResult: (type, message, data = [], total = 0, pagination = null) => ({
    type,
    message,
    data,
    total,
    ...(pagination && { pagination }),
  }),

  FromPaginatedResult: (type, message, data, page, pageSize, totalCount) => {
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      totalCount: parseInt(totalCount, 10),
      totalPages: Math.ceil(totalCount / pageSize),
    };

    return ApiHttpUtility.FromResult(type, message, data, totalCount, pagination);
  },
};

module.exports = ApiHttpUtility;
