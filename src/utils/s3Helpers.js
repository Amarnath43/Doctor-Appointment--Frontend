import axios from 'axios'

export const getPresignedReadUrl = async (key) => {
  const res = await axios.get(`http://localhost:5000/api/uploads/presigned-read-url`, {
    params: { key },
    
  })
  return res.data.url
}
