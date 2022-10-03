[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") > $null
[System.Windows.Forms.DataFormats]::GetFormat(582) > $null # これが無いと読めない!!!!!!!!!!!!
$data = [System.Windows.Forms.Clipboard]::GetData('Format582').toArray()
[system.String]::Join(',', $data)