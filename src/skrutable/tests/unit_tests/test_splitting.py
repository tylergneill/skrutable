import pytest
from unittest.mock import patch

from skrutable.splitting import Splitter

# mcok with Dharmamitra Sept 2024 output
@pytest.mark.parametrize("input_string, mock_return_value, expected_output", [
    (
        "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā\npratikalamanukarṣanyena kīro niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "tava kara-kamala-sthām sphāṭikīm akṣamālām nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā\npratikalam anukarṣan yena kīraḥ niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ"
    ),
    (
        "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām', 'nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ', 'sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "tava kara-kamala-sthām sphāṭikīm akṣamālām , nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā | pratikalam anukarṣan yena kīraḥ niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ ||")
    ,
    (
        "? tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām', 'nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ', 'sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "? tava kara-kamala-sthām sphāṭikīm akṣamālām , nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā | pratikalam anukarṣan yena kīraḥ niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ ||"
    )
])
@patch('skrutable.splitter.wrapper.Splitter._get_dharmamitra_split')
def test_restore_punctuation(mock_get_dharmamitra_split, input_string, mock_return_value, expected_output):
    mock_get_dharmamitra_split.return_value = mock_return_value
    Spl = Splitter()
    result = Spl.split(input_string)
    assert result == expected_output



