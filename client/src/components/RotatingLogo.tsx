export default function RotatingLogo() {
  return <div className="rotating-logo-stage" aria-hidden="true">
    <div className="rotating-logo-cube">
      {['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => <span className={`logo-face logo-face-${face}`} key={face} />)}
    </div>
  </div>
}