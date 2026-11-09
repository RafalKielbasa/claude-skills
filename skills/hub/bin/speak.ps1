# Says the text read from stdin through the local Polish voice. ASCII only: the text arrives as UTF-8 on
# stdin and never as an argument, so a session title cannot reach a command line.
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
$text = [Console]::In.ReadToEnd()
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Paulina Desktop')
$synth.Speak($text)
$synth.Dispose()
