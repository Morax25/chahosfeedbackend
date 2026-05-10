const notFound = (
  req,
  res,
  next
) => {
  res.status(404).json({
    success: false,
    message: 'Invalid endpoint, Route does not exists.'
  })
}

export { notFound }