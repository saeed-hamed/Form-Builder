namespace FormBuilder.Models;

public class LookupValue
{
    public int LookupValueId { get; set; }
    public int LookupId { get; set; }
    public string Value { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}
