import { useParams } from "react-router-dom";

function Page() {
  const { userUUID } = useParams();

  return (
    <div>
      <h1>user/[userUUID]</h1>
      <div>user: {userUUID}</div>
    </div>
  );
}

export default Page;
