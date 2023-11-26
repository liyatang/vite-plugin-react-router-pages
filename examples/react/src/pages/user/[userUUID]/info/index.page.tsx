import { useParams } from "react-router-dom";

function Page() {
  const { userUUID } = useParams();

  return (
    <div>
      <h1>user/[userUUID]/info</h1>
      <div>user: {userUUID} info</div>
    </div>
  );
}

export default Page;
