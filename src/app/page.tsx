import { redirect } from 'next/navigation';

/** 첫 화면(/)은 내 스터디로 보내요. 로그인 안 했으면 거기서 다시 /login으로 가요. */
export default function Index() {
  redirect('/home');
}
