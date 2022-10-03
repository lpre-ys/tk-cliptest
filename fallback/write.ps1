[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") > $null
[System.Windows.Forms.DataFormats]::GetFormat(582) > $null # これが無いと書けない!!!!!!!!!!!!
$input = Get-Clipboard -Format Text
$data = new-object System.IO.MemoryStream(, $input.Split(','));
[System.Windows.Forms.Clipboard]::SetData('Format582', $data)
