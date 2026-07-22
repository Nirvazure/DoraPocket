import Image from 'next/image'

import './login-pocket-stage.css'

export function LoginPocketStage() {
  return (
    <div className="login-stage-enter relative mx-auto flex w-full items-center justify-center">
      <Image
        src="/images/pocket.png"
        alt=""
        width={208}
        height={208}
        priority
        className="animate-dp-pocket-float h-40 w-40 object-contain drop-shadow-[0_16px_32px_rgba(15,23,42,0.16)] sm:h-52 sm:w-52"
        draggable={false}
      />
    </div>
  )
}
